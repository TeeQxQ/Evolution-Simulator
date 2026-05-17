//Feed-forward neural network. Topology is described by layerSizes (e.g. [3, 4, 1]:
//3 input neurons, one hidden layer of 4 neurons, 1 output neuron). Weights is a list
//with one matrix per layer-to-layer transition: weights[L][j][i] is the weight from
//layer L neuron i into layer L+1 neuron j.
class Brain
{
    constructor(layerSizes, weights)
    {
        this.layerSizes = layerSizes;
        this.weights = weights;
    }

    //Convenience: build a Brain of the given shape with random weights in [-1, 1].
    static random(layerSizes)
    {
        const weights = [];
        for (let L = 0; L < layerSizes.length - 1; L++)
        {
            const layerW = [];
            for (let j = 0; j < layerSizes[L + 1]; j++)
            {
                const row = [];
                for (let i = 0; i < layerSizes[L]; i++)
                {
                    row.push(Math.random() * 2 - 1);
                }
                layerW.push(row);
            }
            weights.push(layerW);
        }
        return new Brain(layerSizes, weights);
    }

    activate(x)
    {
        return Math.tanh(x);
    }

    think(inputs)
    {
        let activations = inputs;
        for (let L = 0; L < this.weights.length; L++)
        {
            const next = [];
            for (let j = 0; j < this.layerSizes[L + 1]; j++)
            {
                let sum = 0;
                for (let i = 0; i < activations.length; i++)
                {
                    sum += this.weights[L][j][i] * activations[i];
                }
                next.push(this.activate(sum));
            }
            activations = next;
        }
        return activations;
    }
}
