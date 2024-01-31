from fastapi import FastAPI
from fastapi import Request
from fastapi import File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
from google.cloud import dialogflow_v2beta1 as dialogflow

import db_helper
import generic_helper
from CNN import predict_image

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track orders
inprogress_orders = {}


################################ CNN MODEL ######################################
# CNN MODEL To Predict Images
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        prediction = predict_image(contents)
        print(f"Prediction: {prediction}")
        return {"prediction": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")


session_storage = {}


# Generate session id
def get_session_id(user_id: str):
    # Generate or retrieve the session ID for the user
    if user_id not in session_storage:
        session_id = str(uuid.uuid4())
        session_storage[user_id] = session_id
    else:
        session_id = session_storage[user_id]

    return session_id

# Set the path to your Dialogflow service account key JSON file
credentials_path = './food101.json'

# Create a Dialogflow session client
session_client = dialogflow.SessionsClient.from_service_account_file(credentials_path)


# Route for image-text to Dialogflow
@app.post("/get_image_text_response")
async def get_image_text_response(request: Request):
    try:
        request_json = await request.json()

        # Extract text_input and session_id from the JSON body
        text_input = request_json.get("text_input")
        user_id = request_json.get("user_id")
        session_id = get_session_id(user_id)


        # Create a session with the specified session ID
        session = session_client.session_path('food101-chatbot-dxvi', session_id)

        # Example user input
        user_input = dialogflow.TextInput(text=text_input, language_code="en")
        query_input = dialogflow.QueryInput(text=user_input)

        # Send the user input to Dialogflow
        response = session_client.detect_intent(request={"session": session, "query_input": query_input})

        #Extract the intent name:
        intent = response.query_result.intent.display_name
        parameters = response.query_result.parameters

        # Extract the response text from the Dialogflow response
        response_text = response.query_result.fulfillment_text

        intent_handler_dict = {
            'order.add - context: ongoing-order': add_to_order,
            'order.remove - context: ongoing-order': remove_from_order,
            'order.complete - context: ongoing-order': complete_order,
            'track.order - context: ongoing-tracking': track_order
        }
        # return response:
        if intent in intent_handler_dict:
            return intent_handler_dict[intent](parameters, session_id)
        else:
            return {"response_text": response_text}

    except Exception as e:
        print(f"Error type: {type(e)}")
        print(f"Error details: {e}")
        return {"error": str(e)}

####################################### FRONTEND JSON API #############################
# Route to get all the Food Items
@app.get("/fooditems")
async def food_items():
    results = db_helper.get_all_food_items()
    return results


# Route to get all the Orders
@app.get("/orders_items")
async def orders_items():
    results = db_helper.get_all_order_items()
    return results


# Route to get all the Orders
@app.get("/orders_status")
async def orders_all_order_status():
    results = db_helper.get_all_order_status()
    return results


# %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% DIALOGFLOW %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
# Route and API for Dialogflow Intent fulfillment
@app.post("/")
async def handle_request(request: Request):
    # Retrieve the JSON data from the request
    payload = await request.json()

    # Extract the necessary information from the payload
    # based on the structure of the WebhookRequest from Dialogflow
    intent = payload['queryResult']['intent']['displayName']
    parameters = payload['queryResult']['parameters']
    output_contexts = payload['queryResult']['outputContexts']
    session_id = generic_helper.extract_session_id(output_contexts[0]["name"])

    intent_handler_dict = {
        'order.add - context: ongoing-order': add_to_order,
        'order.remove - context: ongoing-order': remove_from_order,
        'order.complete - context: ongoing-order': complete_order,
        'track.order - context: ongoing-tracking': track_order
    }

    return intent_handler_dict[intent](parameters, session_id)

def save_to_db(order: dict):
    next_order_id = db_helper.get_next_order_id()

    # Insert individual items along with quantity in orders table
    for food_item, quantity in order.items():
        rcode = db_helper.insert_order_item(
            food_item,
            quantity,
            next_order_id
        )

        if rcode == -1:
            return -1

    # Now insert order tracking status
    db_helper.insert_order_tracking(next_order_id, "in progress")

    return next_order_id

def complete_order(parameters: dict, session_id: str):
    if session_id not in inprogress_orders:
        fulfillment_text = "I'm having a trouble finding your order. Sorry! Can you place a new order please?"
    else:
        order = inprogress_orders[session_id]
        order_id = save_to_db(order)
        if order_id == -1:
            fulfillment_text = "Sorry, I couldn't process your order due to a backend error. " \
                               "Please place a new order again"
        else:
            order_total = db_helper.get_total_order_price(order_id)

            fulfillment_text = f"Awesome. We have placed your order. " \
                           f"Here is your order id # {order_id}. " \
                           f"Your order total is {order_total} which you can pay at the time of delivery!"

        del inprogress_orders[session_id]

    return JSONResponse(content={
        "fulfillmentText": fulfillment_text
    })


def add_to_order(parameters: dict, session_id: str):
    food_items = parameters["food-item"]
    quantities = parameters["number"]
    print(f"Food Items:{food_items}")
    print(f"Quantities: {quantities}")

    if len(food_items) != len(quantities):
        fulfillment_text = "Sorry I didn't understand. Can you please specify food items and quantities clearly?"
    else:
        new_food_dict = dict(zip(food_items, quantities))

        if session_id in inprogress_orders:
            current_food_dict = inprogress_orders[session_id]
            current_food_dict.update(new_food_dict)
            inprogress_orders[session_id] = current_food_dict
        else:
            inprogress_orders[session_id] = new_food_dict

        order_str = generic_helper.get_str_from_food_dict(inprogress_orders[session_id])
        fulfillment_text = f"So far you have: {order_str}. Do you need anything else?"

    return JSONResponse(content={
        "fulfillmentText": fulfillment_text
    })


def remove_from_order(parameters: dict, session_id: str):
    if session_id not in inprogress_orders:
        return JSONResponse(content={
            "fulfillmentText": "I'm having a trouble finding your order. Sorry! Can you place a new order please?"
        })
    
    food_items = parameters["food-item"]
    current_order = inprogress_orders[session_id]

    removed_items = []
    no_such_items = []

    for item in food_items:
        if item not in current_order:
            no_such_items.append(item)
        else:
            removed_items.append(item)
            del current_order[item]

    if len(removed_items) > 0:
        fulfillment_text = f'Removed {",".join(removed_items)} from your order!'

    if len(no_such_items) > 0:
        fulfillment_text = f' Your current order does not have {",".join(no_such_items)}'

    if len(current_order.keys()) == 0:
        fulfillment_text += " Your order is empty!"
    else:
        order_str = generic_helper.get_str_from_food_dict(current_order)
        fulfillment_text += f" Here is what is left in your order: {order_str}"

    return JSONResponse(content={
        "fulfillmentText": fulfillment_text
    })


def track_order(parameters: dict, session_id: str):
    order_id = int(parameters['order_id'])
    order_status = db_helper.get_order_status(order_id)
    order_total = db_helper.get_total_order_price(order_id)
    if order_status:
        fulfillment_text = f"The order status for order id: {order_id} totaling KES { order_total} is: {order_status}"
    else:
        fulfillment_text = f"No order found with order id: {order_id}"

    return JSONResponse(content={
        "fulfillmentText": fulfillment_text
    })