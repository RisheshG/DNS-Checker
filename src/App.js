import React, { useState } from "react";

const DNSChecker = () => {
    const [domain, setDomain] = useState("");
    const [recordType, setRecordType] = useState("A");
    const [result, setResult] = useState(null);

    const handleRecordTypeClick = async (type) => {
        setRecordType(type);
        if (!domain) {
            alert("Please enter a domain name.");
            return;
        }

        try {
            let queries = [];

            if (type === "CNAME") {
                queries.push({ queryDomain: domain, queryType: "CNAME" });
            } else if (type === "SPF") {
                queries.push({ queryDomain: domain, queryType: "TXT" });
            } else if (type === "DKIM") {
                let dkimSelectors = ["dkim", "google", "selector1", "selector2"];
                try {
                    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
                    const data = await response.json();

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
                } catch (error) {
                    console.error("Error fetching DKIM selectors:", error);
                }

                dkimSelectors.forEach(selector => {
                    queries.push({ queryDomain: `${selector}._domainkey.${domain}`, queryType: "TXT" });
                });
            } else if (type === "DMARC") {
                queries.push({ queryDomain: `_dmarc.${domain}`, queryType: "TXT" });
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

            if (results.length === 0) {
                setResult({ error: "Record not found." });
            } else {
                setResult({ Answer: results });
            }
        } catch (error) {
            console.error("Error fetching DNS records:", error);
            setResult({ error: "Error fetching DNS records." });
        }
    };

    const getTypeName = (type) => {
        switch(type) {
            case 1: return "A";
            case 5: return "CNAME";
            case 15: return "MX";
            case 16: return "TXT";
            case 2: return "NS";
            case 28: return "AAAA";
            default: return type;
        }
    };

    return (
        <div>
            <h1>DNS Record Checker</h1>
            <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter domain"
            />
            <div>
                {['A', 'CNAME', 'MX', 'TXT', 'NS', 'SPF', 'DKIM', 'DMARC'].map(type => (
                    <button key={type} onClick={() => handleRecordTypeClick(type)}>
                        {type}
                    </button>
                ))}
            </div>
            <div>
                <h2>Results:</h2>
                {result ? (
                    result.error ? (
                        <p>{result.error}</p>
                    ) : (
                        <ul>
                            {result.Answer.map((record, index) => (
                                <li key={index}>
                                    <strong>Type:</strong> {getTypeName(record.type)} | 
                                    <strong> Domain:</strong> {record.name} | 
                                    <strong> TTL:</strong> {record.TTL} | 
                                    <strong> Data:</strong> {record.data}
                                </li>
                            ))}
                        </ul>
                    )
                ) : (
                    <p>No records fetched yet.</p>
                )}
            </div>
        </div>
    );
};

export default DNSChecker;
