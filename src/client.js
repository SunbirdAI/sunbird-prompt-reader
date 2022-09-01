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
