
class Sphere:
    """
        center = vec3
        radius = float
    """

    def __init__(self, center = [0.0, 0.0, 0.0], radius = 1.0):
        self.center = center
        self.radius = radius

    @property
    def vec4(self):
        return [self.center[0], self.center[1], self.center[2], self.radius]
