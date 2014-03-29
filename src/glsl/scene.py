
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

if __name__ == "__main__":
    s = Scene()
    s.add(primitives.Sphere())

    glsl = s.composeGLSL()

    print glsl
