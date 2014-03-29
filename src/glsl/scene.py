
import math
import camera


class Scene:
    """scene content

        camera = Camera()
    """

    def __init__(self):
        self.camera = camera.Camera()


    def composeGLSL(self):

        return """

            void
            main()
            {
                gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
            }

        """
