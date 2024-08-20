export default function getEnumKeyByValue(enumObj: any, value: string) {
    return Object.keys(enumObj).find(key => enumObj[key] === value);
}
