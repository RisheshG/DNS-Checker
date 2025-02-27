import React, { useState } from "react";
import './App.css';

function App() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState("");
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    setDomain(e.target.value);
  };

  const handleRecordTypeClick = async (type) => {
    setRecordType(type);
  
    if (domain) {
      try {
        let queries = [];
  
        if (type === "SPF") {
          queries.push({ queryDomain: domain, queryType: "TXT" }); // SPF records are in TXT format
        } } else if (type === "DKIM") {
  try {
    // Step 1: Fetch all TXT records for the domain
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
    const data = await response.json();

    let dkimSelectors = [];

    if (data.Answer) {
      data.Answer.forEach((record) => {
        if (record.data.includes("v=DKIM1")) {
          const match = record.name.match(/([^\.]+)\._domainkey\./);
          if (match) {
            dkimSelectors.push(match[1]);
          }
        }
      });
    }

    // Step 2: Add common DKIM selectors
    dkimSelectors.push("dkim", "google", "selector1", "selector2");

    // Step 3: Fetch DKIM records for all selectors found
    for (const selector of dkimSelectors) {
      queries.push({ queryDomain: `${selector}._domainkey.${domain}`, queryType: "TXT" });
    }
  } catch (error) {
    console.error("Error fetching DKIM selectors:", error);
  }
}
        } else if (type === "DMARC") {
          queries.push({ queryDomain: `_dmarc.${domain}`, queryType: "TXT" }); // DMARC records are in TXT format
        } else {
          queries.push({ queryDomain: domain, queryType: type });
        }
  
        let results = [];
        for (const query of queries) {
          const response = await fetch(`https://dns.google/resolve?name=${query.queryDomain}&type=${query.queryType}`);
          const data = await response.json();
          if (data.Answer) {
            results.push(...data.Answer);
          }
        }
  
        // Check if results are empty and set the appropriate result
        if (results.length === 0) {
          setResult({ error: "Record not found." });
        } else {
          setResult({ Answer: results });
        }
      } catch (error) {
        console.error("Error fetching DNS records:", error);
        setResult({ error: "Error fetching DNS records." });
      }
    } else {
      alert("Please enter a domain name.");
    }
  };  

  const renderRecordDetails = () => {
    if (result?.Answer) {
      const isMxRecord = recordType === "MX";
      const isSpfRecord = recordType === "SPF";
      const isDkimRecord = recordType === "DKIM";
      const isDmarcRecord = recordType === "DMARC";

      return (
        <table>
          <thead>
            <tr>
              <th>Record Type</th>
              <th>Domain</th>
              {isMxRecord && <th>Priority</th>}
              <th>TTL</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {result.Answer.map((record, index) => {
              const recordData = (isSpfRecord || isDkimRecord || isDmarcRecord) 
                ? record.data 
                : record.data;
              return (
                <tr key={index}>
                  <td>{getTypeName(record.type)}</td>
                  <td>{record.name}</td>
                  {isMxRecord && <td>{getPriority(record.data)}</td>}
                  <td>{record.TTL}</td>
                  <td>{recordData}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    } else if (result?.error) {
      return <p>Error: {result.error}</p>;
    } else {
      return <p>No records found.</p>;
    }
  };

  const getTypeName = (type) => {
    switch(type) {
      case 1: return "A";
      case 15: return "MX";
      case 16: return "TXT";
      case 2: return "NS";
      case 28: return "AAAA";
      default: return type;
    }
  };

  const getPriority = (data) => {
    const parts = data.split(' ');
    return parts.length > 1 ? parts[0] : "N/A";
  };

  return (
    <div className="app">
      <h1>DNS Record Checker</h1>
      <input
        type="text"
        placeholder="Enter domain name"
        value={domain}
        onChange={handleInputChange}
      />
      <div className="button-group">
        <button onClick={() => handleRecordTypeClick("A")}>A Record</button>
        <button onClick={() => handleRecordTypeClick("TXT")}>TXT</button>
        <button onClick={() => handleRecordTypeClick("MX")}>MX</button>
        <button onClick={() => handleRecordTypeClick("NS")}>NS</button>
        <button onClick={() => handleRecordTypeClick("SPF")}>SPF</button>
        <button onClick={() => handleRecordTypeClick("DMARC")}>DMARC</button>
        <button onClick={() => handleRecordTypeClick("AAAA")}>AAAA</button>
        <button onClick={() => handleRecordTypeClick("DKIM")}>DKIM</button>
      </div>
      <div className="result">
        <h2>Result for {recordType} record:</h2>
        {renderRecordDetails()}
      </div>
    </div>
  );
}

export default App;
