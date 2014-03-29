#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
sys.path.append('..')

import math
import camera
import primitives
import material
import library
import utils


from datetime import datetime

import mongoengine

from model.user import User

class Scene(mongoengine.Document):
    """scene content

        camera = Camera()
        primitives = [primitives.Sphere]
    """
    # title = mongoengine.StringField(primary_key=True)
    # description = mongoengine.StringField(default=None)
    # created_by = mongoengine.ReferenceField(User, required=True)
    # creation_time = mongoengine.DateTimeField(default=datetime.now)

    camera = mongoengine.ReferenceField(camera.Camera, default=camera.Camera)
    primitives = mongoengine.ListField(mongoengine.ReferenceField(primitives.Abstract), default=list)

    def add(self, primitive):
        self.primitives.append(primitive)

    def save(self, *args, **kwargs):
        self.camera.save()
        for primitive in filter(lambda e : e is not None, self.primitives):
            primitive.save()
        super(Scene, self).save(*args, **kwargs)

    def composeGLSL(self):
        return library.main(self)

def boiler_scene():
    s = Scene()
    s.camera.position[0] = -3
    s.camera.position[1] = -3
    s.camera.position[2] = 3

    s.camera.direction = utils.normalize(utils.sub([0.0, 0.0, 0.0], s.camera.position))

    #s.add(primitives.Sphere(material=material.Emit(color=[0.5, 0.5, 1.0])))
    s.add(primitives.Sphere(center=[0.0, 0.0, 1.0], radius=1.0))

    s.add(primitives.Plan(normal=[-1.0, 0.0, 0.0], distance=5.0))  # X+
    s.add(primitives.Plan(normal=[1.0, 0.0, 0.0], distance=-5.0))  # X-

    s.add(primitives.Plan(normal=[0.0, -1.0, 0.0], distance=5.0))  # Y+
    s.add(primitives.Plan(normal=[0.0, 1.0, 0.0], distance=-5.0))  # Y-

    s.add(primitives.Plan(normal=[0.0, 0.0, -1.0], distance=10.0)) # Z+
    s.add(primitives.Plan(normal=[0.0, 0.0, 1.0], distance=0.0))   # Z-

    return s

if __name__ == "__main__":
    s = boiler_scene()

    glsl = s.composeGLSL()

    print glsl
