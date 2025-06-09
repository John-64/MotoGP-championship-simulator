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
    <div>
      Test
    </div>
  );
}

export default ResultList;
