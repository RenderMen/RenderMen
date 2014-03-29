
import math
import camera
import primitives


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

        return """

            void
            main()
            {
                gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
            }

        """
