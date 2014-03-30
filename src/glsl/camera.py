import mongoengine
import math

import utils

class Camera(mongoengine.Document):
    """camera

        look_from = vec3
        look_to = vec3
        field_of_view = float
    """

    look_from = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.0, -10.0, 0.0])
    look_at = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.0, 0.0, 0.0])
    field_of_view = mongoengine.FloatField(default=math.pi * 0.33)
    near_plan = mongoengine.FloatField(default=1.0)

    @property
    def direction(self):
        return utils.normalize(utils.sub(self.look_at, self.look_from))
