export const ensure = (condition: boolean, comment: string = 'Condition is not met'): void => {
    if (!condition) {
        throw new Error(comment);
    }
};
