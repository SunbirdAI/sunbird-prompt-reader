import {useState} from "react";


const sentences = [
    "Bbiringanya lubeerera  asinga kukulira mu mbeera ya bugumu",
    "Ettaka ly'okulimirako n'okulundirako ebiseera ebimu kisoomooza abalimi",
    "Abalimi balina okukubirizibwa okwongera okulima emmwanyi",
    "Uganda essira eritadde ku bulimi"
];

const buttonStyle = "m-4 px-6 py-2 bg-purple-400 font-medium rounded shadow-md hover:bg-purple-200 hover:shadow-lg";

const MainComponent = () => {

    const [page, setPage] = useState("start");  // pages: start, prompt, waiting (finish session)

    return (
        <>
            <>{page === "start" && <StartButton setPage={setPage}/>}</>
            <>{page === "prompt" && <PromptText/>}</>
        </>

    )
}

const StartButton = ({setPage}) => {

    const [sessionNumber, setSessionNumber] = useState(1);

    return (
        <button
            onClick={() => setPage("prompt")}
            className={buttonStyle}
        >
            Start Session {sessionNumber}
        </button>
    )
}

const PromptText = () => {

    const [currSentenceIndex, setCurrSentenceIndex] = useState(0);

    const nextSentence = () => {
      setCurrSentenceIndex((currSentenceIndex + 1) % sentences.length);
    }

    return (
        <div className="grid place-items-center p-4">
            <p className="font-medium text-xl">{sentences[currSentenceIndex]}</p>
            <button onClick={nextSentence} className={buttonStyle}>Next Sentence</button>
        </div>
    );
};


export {MainComponent};
