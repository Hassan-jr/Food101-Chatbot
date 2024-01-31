import requests
import json
import numpy as np
import tensorflow as tf

class_names = [
  "Apple pie", "Baby back ribs", "Baklava", "Beef carpaccio", "Beef tartare",
  "Beet salad", "Beignets", "Bibimbap", "Bread pudding", "Breakfast burrito",
  "Bruschetta", "Caesar salad", "Cannoli", "Caprese salad", "Carrot cake",
  "Ceviche", "Cheese plate", "Cheesecake", "Chicken curry", "Chicken quesadilla",
  "Chicken wings", "Chocolate cake", "Chocolate mousse", "Churros", "Clam chowder",
  "Club sandwich", "Crab cakes", "Creme brulee", "Croque madame", "Cupcake",
  "Deviled eggs", "Donuts", "Dumplings", "Edamame", "Eggs Benedict", "Escargots",
  "Falafel", "Filet mignon", "Fish and chips", "Foie gras", "French fries",
  "French onion soup", "French toast", "Fried calamari", "Fried rice", "Frozen yogurt",
  "Garlic bread", "Gnocchi", "Greek salad", "Grilled cheese sandwich", "Grilled salmon",
  "Guacamole", "Gyoza", "Hamburger", "Hot and sour soup", "Hot dog", "Huevos rancheros",
  "Hummus", "Ice cream", "Lasagna", "Lobster bisque", "Lobster roll sandwich",
  "Macaroni and cheese", "Macarons", "Miso soup", "Mussels", "Nachos", "Omelette",
  "Onion rings", "Oysters", "Pad Thai", "Paella", "Pancakes", "Panna cotta",
  "Peking duck", "Pho", "Pizza", "Pork chop", "Poutine", "Prime rib",
  "Pulled pork sandwich", "Ramen", "Ravioli", "Red velvet cake", "Risotto",
  "Samosa", "Sashimi", "Scallops", "Seaweed salad", "Shrimp and grits",
  "Spaghetti bolognese", "Spaghetti carbonara", "Spring rolls", "Steak",
  "Strawberry shortcake", "Sushi", "Tacos", "Takoyaki", "Tiramisu",
  "Tuna tartare", "Waffles"
]


def predict_image(file_contents):
    try:
        img = tf.image.decode_image(file_contents, channels=3)
        img = tf.image.resize(img, (224, 224))
        img_array = tf.expand_dims(img, axis=0)

        # print(img_array)

        # Convert the image data to bytes for JSON serialization
        # instances_bytes = tf.io.serialize_tensor(img_array).numpy().tolist()
        instances = img_array.numpy().tolist()

        # Prepare the payload for the prediction request
        # {"signature_name": "serving_default", "instances": [{"b64": base64.b64encode(instances_bytes).decode('utf-8')}]}
        data = json.dumps({"signature_name": "serving_default", "instances": instances})
        headers = {"content-type": "application/json"}

        # Set the correct URL for your TensorFlow Serving API
        url = 'http://localhost:8601/v1/models/food101/versions/1:predict'

        # Make the prediction request
        json_response = requests.post(url, data=data, headers=headers)
        predictions = json.loads(json_response.text)['predictions']
        label_index = np.argmax(predictions[0])
        return class_names[int(label_index)]
    except Exception as e:
     print(f"Error in predict_image: {str(e)}")
     raise



