import { useEffect, useState } from "react";

function ResultList() {
  const [results, setResults] = useState([]);

    useEffect(() => {
      fetch("http://127.0.0.1:5000/api/results")
        .then(res => res.json())
        .then(data => setResults(data))
        .catch(err => console.error(err));
    }, []);


  return (
    <div className="w-full h-full flex justify-center items-center text-2xl ">
      Qui ci saranno tutti i risultati dei vari campionati
      {results}
    </div>
  );
}

export default ResultList;
