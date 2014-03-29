
import math
import camera
import primitives
import material
import library


class Scene:
    """scene content

        camera = Camera()
        primitives = [primitives.Sphere]
    """

    def __init__(self):
        self.camera = camera.Camera()
        self.primitives = []

    def add(self, primitive):
        assert(isinstance(primitive, primitives.Sphere) == True)

        self.primitives.append(primitive)

    def composeGLSL(self):
        return library.main(self)

def boiler_scene():
    s = Scene()
    s.camera.position[1] = -3
    s.add(primitives.Sphere(material=material.Emit(color=[0.5, 0.5, 1.0])))

    return s

if __name__ == "__main__":
    s = boiler_scene()

    glsl = s.composeGLSL()

    print glsl
