let enabled = false;

export const componentDoublesEnabled = () => enabled;

export const enableComponentDoubles = () => {
    enabled = true;
};

export const disableComponentDoubles = () => {
    enabled = false;
};
