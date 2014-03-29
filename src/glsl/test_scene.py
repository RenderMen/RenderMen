
from scene import Scene
import primitives

def test_scene():
    s = Scene()
    s.add(primitives.Sphere(radius=3.0))

    glsl = s.composeGLSL()

    assert glsl != ""
