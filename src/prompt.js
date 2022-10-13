import {useEffect, useState} from "react";
import lugandaSentences from './luganda_sentences.json';
import englishSentences from './english_sentences.json';
import {getNextSession, addSession, createRecordings} from "./client";


const buttonStyle = "m-4 px-6 py-2 font-medium rounded shadow-md hover:shadow-lg";
const purpleButton = "bg-purple-400 hover:bg-purple-200";
const orangeButton = "bg-orange-400 hover:bg-orange-200"
const redButton = "bg-red-400 hover:bg-red-200";
const sessionSize = 10;  // Number of sentences in a single session // TODO: Should this be increased? (feedback from reader)
const defaultSessionState = {"Luganda": -1, "English": -1};
const timeBetweenSentences = 0;  // in seconds
const totalLugandaSentences = lugandaSentences.length;
const totalEnglishSentences = englishSentences.length;
console.log(`${totalLugandaSentences} ${totalEnglishSentences}`);


const MainComponent = () => {

    const [page, setPage] = useState("start");  // pages: start, prompt, waiting (finish session)
    const [session, setSession] = useState({});
    const [sessionState, setSessionState] = useState(defaultSessionState);
    const [loggingSession, setLoggingSession] = useState(0);  // 0 -> not logging session, 1 -> logging session 2 -> finished logging session
    const [sentenceRecordings, setSentenceRecordings] = useState([]);

    // TODO: Add progress indicator (for both recordings and sessions)

    const startSession = async (language) => {
        // Fetches the last session from the server and uses it to set the session_id
        // Each session's sentences range from indices: (sessionId * sessionSize)...(sessionId * (sessionSize + 1) - 1)
        const sessionId = sessionState[language];
        setSession({
            "start_time": Date.now(),
            "no_of_sentences": 0,
            "session_id": `${language} ${sessionId}`,
            "first_sentence_id": sessionId * sessionSize,
            "language": language
        });
        setPage("prompt");
    }

    const fetchNextSession = async () => {
        const nextSessionState = await getNextSession();
        setSessionState(nextSessionState);
    }

    const logSessionToServer = async (session) => {
        await addSession(session);
    }

    const endSession = (last_sentence_id) => {
        setSession(
            {
                ...session,
                "end_time": Date.now(),
                "last_sentence_id": last_sentence_id
            }
        )
        setPage("logging-session");
    }

    const logSession = async () => {
        console.log(`Ending session: ${JSON.stringify(session)}`);
        await logSessionToServer(session);
        console.log(`Sentence recordings for session: ${JSON.stringify(sentenceRecordings)}`);
        await createRecordings(sentenceRecordings);
        // for (const sentenceRecording in sentenceRecordings) {
        //     await createRecording(sentenceRecording);
        // }
        setLoggingSession(2);
    }

    useEffect(() => {
        if (loggingSession === 1) {
            logSession();
        } else if (loggingSession === 2) {
            const timeout = setTimeout(() => {
                setLoggingSession(0);
                setSessionState(defaultSessionState);
                setPage("start");
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [loggingSession]);

    // Log the current session
    useEffect(() => {
        if ("end_time" in session) {
            setLoggingSession(1);
            // logSessionToServer(session);
        } else if ("start_time" in session) {
            console.log(`Starting session: ${JSON.stringify(session)}`);
        }
    }, [session]);

    // Fetch the next session's id
    useEffect(() => {
        console.log(sessionState);
        if (sessionState["Luganda"] === -1)
            fetchNextSession();
    }, [sessionState]);

    return (
        <>
            {
                sessionState["Luganda"] === -1 ? "Getting next session..." :
                    <>
                        <>
                            {
                                page === "start" &&
                                <div>

                                    <StartButton
                                        language="Luganda"
                                        startSession={startSession}
                                        sessionId={sessionState["Luganda"]}
                                    />
                                    <StartButton
                                        language="English"
                                        startSession={startSession}
                                        sessionId={sessionState["English"]}
                                    />
                                </div>
                            }
                        </>
                        <>
                            {
                                page === "prompt" &&
                                <PromptText
                                    endSession={endSession}
                                    session={session}
                                    sentences={session.language === "Luganda" ? lugandaSentences : englishSentences}
                                    setSentenceRecordings={setSentenceRecordings}
                                />
                            }
                        </>
                        <>
                            {
                                page === "logging-session" &&
                                <p className="text-l">Thank you! Please wait while we send the sentences to the server.</p>
                            }
                        </>
                    </>
            }
        </>

    );
}

const StartButton = ({startSession, sessionId, language}) => {

    return (
        <>
            <button
                onClick={() => startSession(language)}
                className={`${buttonStyle} ${language === "Luganda" ? purpleButton : orangeButton}`}
            >
                {`Start ${language} Session ${sessionId}`}
            </button>
        </>

    )
}

const PromptText = ({session, endSession, sentences, setSentenceRecordings}) => {

    // const [currSentenceIndex, setCurrSentenceIndex] = useState(session.first_sentence_id);
    const [waiting, setWaiting] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    // const [sentenceStartTime, setSentenceStartTime] = useState(Date.now());
    const [currSentenceState, setCurrSentenceState] = useState({
        sentenceIndex: session.first_sentence_id,
        startTime: Date.now()
    })

    const nextSentence = async () => {
        const sentenceRecording = {
            "start_time": currSentenceState.startTime,
            "end_time": Date.now(),
            "session_id": String(session.session_id),
            "sentence": sentences[currSentenceState.sentenceIndex],
            "sentence_id": `${session.language} ${currSentenceState.sentenceIndex}`,
        }

        console.log(`Finished reading a sentence: ${JSON.stringify(sentenceRecording)}`);
        // setWaiting(true); // will call useEffect. Uncomment if need time out
        // createRecording(sentenceRecording);
        setSentenceRecordings(prevState => [...prevState, sentenceRecording]);
        setCurrSentenceState(prevState => ({
            sentenceIndex: prevState.sentenceIndex + 1,
            startTime: Date.now()

        }));
    }

    useEffect(() => {
        if (waiting) {
            const timeout = setTimeout(() => {
                setCurrSentenceState(prevState => ({
                    sentenceIndex: prevState.sentenceIndex + 1,
                    startTime: Date.now()

                }));
                setWaiting(false);
            }, timeBetweenSentences);
            return () => clearTimeout(timeout);
        }

    }, [waiting]);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - session.start_time);
        }, 1000);

        return () => clearInterval(interval);
    })

    return (
        <div className="grid place-items-center p-4">
            {/*<p className="text-purple-400 font-medium">{millisecondsToHuman(elapsedTime)}</p>*/}
            {/*Use below if there is a timeout*/}
            {/*{!waiting &&*/}
            {/*<>*/}
            {/*    <p className="font-medium text-xl">{sentences[currSentenceIndex]}</p>*/}
            {/*    <button*/}
            {/*        onClick={nextSentence}*/}
            {/*        className={`${buttonStyle} ${session.language === "Luganda" ? purpleButton : orangeButton}`}>*/}
            {/*        Next Sentence*/}
            {/*    </button>*/}
            {/*</>}*/}
            {/*{waiting &&*/}
            {/*((currSentenceIndex % sessionSize === sessionSize - 1*/}
            {/*        || currSentenceIndex === sentences.length - 1) ?*/}
            {/*        <button onClick={() => endSession(currSentenceIndex)}*/}
            {/*                className={`${buttonStyle} ${redButton} my-10`}>Finish Session*/}
            {/*        </button> :*/}
            {/*        <p>Waiting 3 seconds for next sentence...</p>*/}
            {/*)*/}
            {/*}*/}
            {currSentenceState.sentenceIndex === sentences.length || currSentenceState.sentenceIndex === (session.first_sentence_id + sessionSize) ?
                <button onClick={() => endSession(currSentenceState.sentenceIndex)}
                        className={`${buttonStyle} ${redButton} my-10`}>Finish Session
                </button> :
                <>
                    <p className="m-24">Save the file as <strong className="text-l">{`${session.language} ${currSentenceState.sentenceIndex}`}</strong></p>
                    <p className="font-medium text-xl">{sentences[currSentenceState.sentenceIndex]}</p>
                    <button
                        onClick={nextSentence}
                        className={`${buttonStyle} ${session.language === "Luganda" ? purpleButton : orangeButton}`}>
                        Next Sentence
                    </button>
                </>
            }
        </div>
    );
};


export {MainComponent};
