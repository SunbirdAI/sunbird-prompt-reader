const API_URL = process.env.REACT_APP_API_URL;
const nextSessionURL = `${API_URL}/next-session`;
const addSessionURL = `${API_URL}/add-session`;
const createRecordingURL = `${API_URL}/create-recording`;


export const getNextSession = async () => {
    const requestOptions = {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    }
    console.log(nextSessionURL);
    const response = await (await fetch(nextSessionURL, requestOptions)).json();
    console.log(response);
    return response['next-session'];
}

export const addSession = async (session) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
    }

    const response = await (await fetch(addSessionURL, requestOptions)).json();
    console.log(response);
}

export const createRecording = async (sentenceRecording) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sentenceRecording)
    }

    const response = await (await fetch(createRecordingURL, requestOptions)).json();
    console.log(response);
}
