
import math

class Camera:
    """camera

        position = vec3
        direction = vec3
        field_of_view = float
    """

    def __init__(self):
        self.position = [0.0, -10.0, 0.0]
        self.direction = [0.0, 1.0, 0.0]
        self.field_of_view = math.pi * 0.5
