
import scene
import primitives

def test_scene():
    s = scene.Scene()
    s.add(primitives.Sphere(radius=3.0))

    glsl = s.composeGLSL()

    assert glsl != ""

    r = scene.Rendering.create(s, width=129, height=129, samples=1)

    assert len(r.assignments) == 4
