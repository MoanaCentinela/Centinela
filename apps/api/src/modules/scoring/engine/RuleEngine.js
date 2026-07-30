export class RuleEngine {
    rules = [];
    constructor(initialRules = []) {
        initialRules.forEach((rule) => this.registerRule(rule));
    }
    registerRule(rule) {
        this.rules.push(rule);
    }
    getRules() {
        return this.rules;
    }
    async executeAll(transaction, context) {
        const results = [];
        for (const rule of this.rules) {
            const result = await rule.evaluate(transaction, context);
            results.push(result);
        }
        return results;
    }
}
