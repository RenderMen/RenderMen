
import math

def code_vec(array):
    """ Generates vecN(attributes) from a array

    """
    assert isinstance(array, list)
    assert len(array) > 1
    assert len(array) <= 4

    str_array = [str(x) for x in array]

    return "vec{}({})".format(len(array), ', '.join(str_array))

def sub(a, b):
    assert len(a) == len(b)

    return [a[i] - b[i] for i in range(0, len(a))]

def length(v):
    return math.sqrt(sum([x * x for x in v]))

def normalize(v):
    l = 1.0 / length(v)

    return [x * l for x in v]
