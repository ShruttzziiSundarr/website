// One shared uniform for the whole scene: 0 is night, 1 is day.
// Every shader holds a reference to this same object, so a single tween moves them all.
export const daylight = { value: 0 };
