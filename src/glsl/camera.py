import mongoengine
import math

class Camera(mongoengine.Document):
    """camera

        position = vec3
        direction = vec3
        field_of_view = float
    """

    position = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.0, -10.0, 0.0])
    direction = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.0, 1.0, 0.0])
    field_of_view = mongoengine.FloatField(default=math.pi * 0.5)