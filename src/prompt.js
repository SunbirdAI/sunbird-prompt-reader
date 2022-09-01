import {useEffect, useState} from "react";
import {millisecondsToHuman} from "./helpers";
import sentences from './luganda_sentences.json';


const buttonStyle = "m-4 px-6 py-2 font-medium rounded shadow-md hover:shadow-lg";
const purpleButton = "bg-purple-400 hover:bg-purple-200";
const redButton = "bg-red-400 hover:bg-red-200";

const MainComponent = () => {

    const [page, setPage] = useState("start");  // pages: start, prompt, waiting (finish session)
    const [session, setSession] = useState({});

    // TODO: Static sessions. 10 sentences per session.
    // TODO: Add progress indicator (for both recordings and sessions)

    const startSession = () => {
        // TODO: Fetch the last session from the server and use it to set the session_id
        // TODO: Also fetch the last sentence to be recorded and use it to set first_sentence_id
        setSession({
            "start_time": Date.now(),
            "no_of_sentences": 0,
            "session_id": 1,
            "first_sentence_id": 0
        });
        setPage("prompt");
    }

    const endSession = (last_sentence_id) => {
        setSession(
            {
                ...session,
                "end_time": Date.now(),
                "last_sentence_id": last_sentence_id
            }
        )
        setPage("start");
    }

    // Log the current session
    useEffect(() => {
        if ("end_time" in session) {
            console.log(`Ending session: ${JSON.stringify(session)}`);
            // TODO: Log this session to the server
        } else if ("start_time" in session) {
            console.log(`Starting session: ${JSON.stringify(session)}`)
        }
    }, [session]);

    return (
        <>
            <>{page === "start" &&
            <StartButton
                startSession={startSession}
                session={session}
            />}
            </>
            <>{page === "prompt" &&
            <PromptText
                endSession={endSession}
                session={session}
            />
            }
            </>
        </>

    )
}

const StartButton = ({startSession, session}) => {

    return (
        <>
            <button
                onClick={() => startSession()}
                className={`${buttonStyle} ${purpleButton}`}
            >
                Start New Session
            </button>
        </>

    )
}

const PromptText = ({session, endSession}) => {

    const [currSentenceIndex, setCurrSentenceIndex] = useState(0);
    const [waiting, setWaiting] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [sentenceStartTime, setSentenceStartTime] = useState(Date.now());

    const nextSentence = () => {
        // TODO: Log sentence to the server
        const sentenceRecording = {
            "start_time": sentenceStartTime,
            "end_time": Date.now(),  // TODO: should this be relative to the sentence start time
            "session_id": session.session_id,
            "sentence": sentences[currSentenceIndex],
            "sentence_id": currSentenceIndex
        }
        console.log(`Finished reading a sentence: ${JSON.stringify(sentenceRecording)}`);
        setWaiting(true); // will call useEffect
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
            <>
                <button onClick={() => endSession(currSentenceIndex)}
                        className={`${buttonStyle} ${redButton} my-10`}>Finish Session
                </button>
                {// TODO: Replace this with a spinner/loader
                }
                <p>Waiting 3 seconds ... (click the finish button if you're done recording)</p>
            </>}
        </div>
    );
};


export {MainComponent};
