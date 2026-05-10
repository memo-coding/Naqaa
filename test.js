const validations = {
  name: [val => !val ? "error" : undefined]
};
const values = { name: "" };
const newErrors = {};
let isValid = true;

for (const key in validations) {
  const rules = validations[key];
  if (rules) {
    for (const rule of rules) {
      const errorMessage = rule(values[key]);
      if (errorMessage) {
        newErrors[key] = errorMessage;
        isValid = false;
        break; // Stop at first error for each field
      }
    }
  }
}
console.log(newErrors, isValid);
