
def code_vec(array):
    """ Generates vecN(attributes) from a array

    """
    assert isinstance(array, list)
    assert len(array) > 1
    assert len(array) <= 4

    str_array = [str(x) for x in array]

    return "vec{}({})".format(len(array), ', '.join(str_array))
