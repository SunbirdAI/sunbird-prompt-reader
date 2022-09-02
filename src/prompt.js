import {useEffect, useState} from "react";
import {millisecondsToHuman} from "./helpers";
import sentences from './luganda_sentences.json';
import {getNextSession, addSession, createRecording} from "./client";


const buttonStyle = "m-4 px-6 py-2 font-medium rounded shadow-md hover:shadow-lg";
const purpleButton = "bg-purple-400 hover:bg-purple-200";
const redButton = "bg-red-400 hover:bg-red-200";
const sessionSize = 10;  // Number of sentences in a single session // TODO: Should this be increased? (feedback from reader)

const MainComponent = () => {

    const [page, setPage] = useState("start");  // pages: start, prompt, waiting (finish session)
    const [session, setSession] = useState({});
    const [sessionId, setSessionId] = useState(-1);

    // TODO: Static sessions. 10 sentences per session.
    // TODO: Add progress indicator (for both recordings and sessions)

    const startSession = async () => {
        // Fetches the last session from the server and uses it to set the session_id
        // Each session's sentences range from indices: (sessionId * sessionSize)...(sessionId * (sessionSize + 1) - 1)
        setSession({
            "start_time": Date.now(),
            "no_of_sentences": 0,
            "session_id": String(sessionId),
            "first_sentence_id": sessionId * sessionSize
        });
        setPage("prompt");
    }

    const fetchNextSession = async () => {
        const nextSessionId = await getNextSession();
        setSessionId(nextSessionId);
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
        setSessionId(-1)
        setPage("start");
    }

    // Log the current session
    useEffect(() => {
        if ("end_time" in session) {
            console.log(`Ending session: ${JSON.stringify(session)}`);
            logSessionToServer(session)
        } else if ("start_time" in session) {
            console.log(`Starting session: ${JSON.stringify(session)}`);
        }
    }, [session]);

    // Fetch the next session's id
    useEffect(() => {
        console.log(sessionId);
        if (sessionId === -1)
            fetchNextSession();
    }, [sessionId]);

    return (
        <>
            {
                sessionId === -1 ? "Getting next session..." :
                    <>
                        <>
                            {
                                page === "start" &&
                                <StartButton
                                    startSession={startSession}
                                    sessionId={sessionId}
                                />
                            }
                        </>
                        <>
                            {
                                page === "prompt" &&
                                <PromptText
                                    endSession={endSession}
                                    session={session}
                                />
                            }
                        </>
                    </>
            }
        </>

    )
}

const StartButton = ({startSession, sessionId}) => {

    return (
        <>
            <button
                onClick={() => startSession()}
                className={`${buttonStyle} ${purpleButton}`}
            >
                {`Start Session ${sessionId}`}
            </button>
        </>

    )
}

const PromptText = ({session, endSession}) => {

    const [currSentenceIndex, setCurrSentenceIndex] = useState(session.first_sentence_id);
    const [waiting, setWaiting] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [sentenceStartTime, setSentenceStartTime] = useState(Date.now());

    const nextSentence = async () => {
        const sentenceRecording = {
            "start_time": sentenceStartTime,
            "end_time": Date.now(),
            "session_id": String(session.session_id),
            "sentence": sentences[currSentenceIndex],
            "sentence_id": String(currSentenceIndex)
        }
        console.log(`Finished reading a sentence: ${JSON.stringify(sentenceRecording)}`);
        setWaiting(true); // will call useEffect
        createRecording(sentenceRecording);
    }

    useEffect(() => {
        if (waiting) {
            const timeout = setTimeout(() => {
                setCurrSentenceIndex((currSentenceIndex + 1) % sentences.length);
                setWaiting(false);
                setSentenceStartTime(Date.now());
            }, 3000); // TODO: Maybe use 5000 seconds.
            return () => clearTimeout(timeout);
        }

    }, [waiting, currSentenceIndex]);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - session.start_time);
        }, 1000);

        return () => clearInterval(interval);
    })

    return (
        <div className="grid place-items-center p-4">
            <p className="text-purple-400 font-medium">{millisecondsToHuman(elapsedTime)}</p>
            {!waiting &&
            <>
                <p className="font-medium text-xl">{sentences[currSentenceIndex]}</p>
                <button
                    onClick={nextSentence}
                    className={`${buttonStyle} ${purpleButton}`}>
                    Next Sentence
                </button>
            </>}
            {waiting &&
            ((currSentenceIndex % sessionSize === sessionSize - 1
                    || currSentenceIndex === sentences.length - 1) ?
                    <button onClick={() => endSession(currSentenceIndex)}
                            className={`${buttonStyle} ${redButton} my-10`}>Finish Session
                    </button> :
                    <p>Waiting 3 seconds for next sentence...</p>
            )
            }
        </div>
    );
};


export {MainComponent};