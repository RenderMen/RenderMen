
import utils


def test_code_vec():
    assert utils.code_vec([0.0, 1.0]) == "vec2(0.0, 1.0)"
    assert utils.code_vec([0.0, 1.0, 2.0]) == "vec3(0.0, 1.0, 2.0)"
    assert utils.code_vec([0.0, 1.0, 2.0, 3.0]) == "vec4(0.0, 1.0, 2.0, 3.0)"
