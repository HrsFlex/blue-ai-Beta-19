# Personal Voice Assistant

This project is a voice-based personal assistant built using Flask, the Gemini API for generating AI-based responses, and ElevenLabs for generating voice output. The assistant listens to the user's speech, processes the input, and responds with both text and voice. It's designed as a professional portfolio project, demonstrating chatbot development with voice interaction.

Video Demo: https://youtu.be/T6_-aqqt52o

## Features
- **Voice Recognition**: Uses the browser's SpeechRecognition API (or Webkit for Chrome) to capture voice input.
- **AI-Powered Responses**: The chatbot is powered by Google Generative AI’s Gemini model to generate dynamic, contextual responses.
- **Voice Output**: ElevenLabs API converts the AI-generated response text to audio, giving the assistant the ability to respond in a human-like voice.
- **Conversation History**: Maintains a history of the conversation to keep context between interactions.
- **Customizable Voices**: Allows users to select different voices for the voice output.

## Technologies Used
- **Backend**: Flask
- **AI/ML**: Google Gemini API
- **Text-to-Speech**: ElevenLabs API
- **Frontend**: HTML, CSS, JavaScript (with SpeechRecognition and Web Speech Synthesis APIs)

## Setup

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/your-project.git](https://github.com/datageekrj/Personal-Voice-Assistant.git)
cd your-project
```

### 2. Install dependencies
Make sure you have Python installed on your system. Install the required Python packages by running:
```bash
pip install -r requirements.txt
```

The `requirements.txt` file should include:
```
Flask
google-generativeai
elevenlabs
```

### 3. API Key Configuration
You need to set up API keys for Google Generative AI and ElevenLabs. Follow the steps below:

- Obtain an API key for Google Generative AI's **Gemini API** by signing up at [Google Cloud](https://cloud.google.com/).
- Obtain an API key for **ElevenLabs API** by signing up at [ElevenLabs](https://elevenlabs.io/).

Once you have both API keys, create a file named `api_key.json` in the root directory of the project with the following structure:
```json
{
  "key": "your-gemini-api-key",
  "eleven_labs": "your-eleven-labs-api-key"
}
```

### 4. Run the application
To start the Flask server, run the following command:
```bash
python app.py
```
The app should now be running on `http://127.0.0.1:5000/`.

### 5. Open the Application in Browser
Open your web browser and navigate to `http://127.0.0.1:5000/` to interact with your Personal Voice Assistant.

## Project Structure

```
.
├── app.py               # Main Flask application
├── templates
│   └── index.html       # HTML file for the web interface
├── static               # Static files like CSS, JS (if any)
├── api_key.json         # API keys file (ensure this is excluded from GitHub)
├── requirements.txt     # List of Python dependencies
└── README.md            # Documentation
```

### Key Files:
- **app.py**: The core Flask application. It handles routing, interacts with the Gemini and ElevenLabs APIs, and processes user input/output.
- **index.html**: The frontend interface that allows users to interact with the chatbot using their voice.
- **api_key.json**: A file containing the API keys for Google Gemini and ElevenLabs (make sure to exclude this from version control).

## Usage
1. **Speak**: Click the microphone icon on the web page, and start speaking. The assistant will recognize your voice input and convert it to text.
2. **Respond**: The backend AI model will generate a response, and it will be played aloud using the selected voice.

## Customization

### Voices
To use a different voice for the assistant, simply change the `voice` parameter in the API call to one of the available voices provided by ElevenLabs in the `index.html` dropdown. The `index.html` dynamically fetches the available voices from the browser's SpeechSynthesis API.

### Conversation History
The conversation history is maintained to keep context between exchanges. If you'd like to reset the history at any point, you can modify the backend logic in `app.py` accordingly.

## Demo Video
Include a link to a demonstration video of the project on your [[YouTube channel]()](https://youtu.be/T6_-aqqt52o) showcasing the chatbot in action.

## Deployment
If you'd like to deploy this project to a cloud platform (e.g., Heroku, AWS, etc.), you may need to make the following modifications:
- Ensure your API keys are securely stored using environment variables instead of the `api_key.json` file.
- Add any necessary deployment configuration files (like `Procfile` for Heroku).

## Contributions
Feel free to fork this project, raise issues, or submit PRs if you have ideas for improvements!

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements
- **Google Generative AI (Gemini API)** for providing the chatbot's intelligence.
- **ElevenLabs API** for generating human-like voice outputs.
- Icons provided by [Flaticon](https://www.flaticon.com/).
