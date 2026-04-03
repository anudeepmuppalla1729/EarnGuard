// Jest generic mock for UUID module to bypass ESM compilation exceptions smoothly
let counter = 0;
export function v4() {
    counter++;
    const hex = counter.toString(16).padStart(12, '0');
    return `123e4567-e89b-42d3-a456-${hex}`;
}
