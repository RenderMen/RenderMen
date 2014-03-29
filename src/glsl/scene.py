
import math
import camera
import primitives
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
    s.add(primitives.Sphere())

    return s

if __name__ == "__main__":
    s = boiler_scene()

    glsl = s.composeGLSL()

    print glsl
