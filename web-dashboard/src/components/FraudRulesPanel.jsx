import { useEffect, useState } from "react";
import {
    getFraudRules,
    createFraudRule,
    updateRuleStatus,
    deleteRule
} from "../services/analyticsService";

export default function FraudRulesPanel() {
    const [rules, setRules] = useState([]);
    const [rule, setRule] = useState({
        ruleName: "",
        ruleType: "HIGH_AMOUNT",
        conditionValue: "",
        riskPoints: 10,
        active: true
    });

    const loadRules = async () => {
        const data = await getFraudRules();
        setRules(Array.isArray(data) ? data : []);
    };

    useEffect(() => {
        loadRules();
    }, []);

    const handleCreate = async () => {
        await createFraudRule(rule);
        setRule({
            ruleName: "",
            ruleType: "HIGH_AMOUNT",
            conditionValue: "",
            riskPoints: 10,
            active: true
        });
        loadRules();
    };

    return (
        <div className="rules-panel">
            <h2>Fraud Rules Engine</h2>
            <p className="column-subtitle">Admin-managed fraud detection rules</p>

            <div className="rules-form">
                <input
                    placeholder="Rule Name"
                    value={rule.ruleName}
                    onChange={(e) => setRule({ ...rule, ruleName: e.target.value })}
                />

                <select
                    value={rule.ruleType}
                    onChange={(e) => setRule({ ...rule, ruleType: e.target.value })}
                >
                    <option value="HIGH_AMOUNT">High Amount</option>
                    <option value="NEW_DEVICE">New Device</option>
                    <option value="UNUSUAL_LOCATION">Unusual Location</option>
                    <option value="INTERNATIONAL_TRANSFER">International Transfer</option>
                    <option value="RAPID_TRANSACTION_PATTERN">Rapid Transaction Pattern</option>
                    <option value="HIGH_RISK_COUNTRY">High Risk Country</option>
                </select>

                <input
                    placeholder="Condition Value"
                    value={rule.conditionValue}
                    onChange={(e) => setRule({ ...rule, conditionValue: e.target.value })}
                />

                <input
                    type="number"
                    placeholder="Risk Points"
                    value={rule.riskPoints}
                    onChange={(e) =>
                        setRule({ ...rule, riskPoints: Number(e.target.value) })
                    }
                />

                <button onClick={handleCreate}>Add Rule</button>
            </div>

            <div className="rules-list">
                {rules.map((item) => (
                    <div className="rule-card" key={item.id}>
                        <div>
                            <h3>{item.ruleName}</h3>
                            <p>{item.ruleType} · Condition: {item.conditionValue}</p>
                            <strong>{item.riskPoints} pts</strong>
                        </div>

                        <span className={`badge ${item.active ? "open" : "critical"}`}>
                            {item.active ? "ACTIVE" : "DISABLED"}
                        </span>

                        <button onClick={() => updateRuleStatus(item.id, !item.active).then(loadRules)}>
                            {item.active ? "Disable" : "Enable"}
                        </button>

                        <button onClick={() => deleteRule(item.id).then(loadRules)}>
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
