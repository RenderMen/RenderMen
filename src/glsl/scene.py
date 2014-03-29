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
    title = mongoengine.StringField(primary_key=True)
    description = mongoengine.StringField(default=None)
    created_by = mongoengine.ReferenceField(User, required=True)
    creation_time = mongoengine.DateTimeField(default=datetime.now)

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

def boiler_scene(user, title, description):
    s = Scene(created_by=user, title=title, description=description)
    s.camera.position[0] = -3
    s.camera.position[1] = -3
    s.camera.position[2] = 3

    s.camera.direction = utils.normalize(utils.sub([0.0, 0.0, 0.0], s.camera.position))

    #s.add(primitives.Sphere(material=material.Emit(color=[0.5, 0.5, 1.0])))
    s.add(primitives.Sphere(center=[0.0, 0.0, 1.0], radius=1.0, material=material.Emit(color=[5.0, 5.0, 5.0])))
    s.add(primitives.Sphere(center=[0.0, 3.0, 1.0], radius=1.0, material=material.Mirror(color=[5.0, 5.0, 5.0])))

    s.add(primitives.Plan(
        normal=[-1.0, 0.0, 0.0],
        distance=5.0,
        material=material.Diffuse(albedo=[0.75, 0.25, 0.25]))
    )  # X+
    s.add(primitives.Plan(
        normal=[1.0, 0.0, 0.0],
        distance=-5.0,
        material=material.Diffuse(albedo=[0.25, 0.25, 0.75]))
    )  # X-

    s.add(primitives.Plan(normal=[0.0, -1.0, 0.0], distance=5.0, material=material.Diffuse()))  # Y+
    s.add(primitives.Plan(normal=[0.0, 1.0, 0.0], distance=-5.0, material=material.Diffuse()))  # Y-

    s.add(primitives.Plan(normal=[0.0, 0.0, -1.0], distance=10.0, material=material.Diffuse())) # Z+
    s.add(primitives.Plan(normal=[0.0, 0.0, 1.0], distance=0.0, material=material.Diffuse()))   # Z-

    return s

if __name__ == "__main__":
    s = boiler_scene(user=None, title="dummy title", description="dummy description")

    glsl = s.composeGLSL()

    print glsl
