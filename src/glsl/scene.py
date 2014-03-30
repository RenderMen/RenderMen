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
import datetime
import config


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
    date_created = mongoengine.DateTimeField(default=datetime.now)


    camera = mongoengine.ReferenceField(camera.Camera, default=camera.Camera)
    primitives = mongoengine.ListField(mongoengine.ReferenceField(primitives.Abstract), default=list)

    def add(self, primitive):
        self.primitives.append(primitive)

    def save(self, *args, **kwargs):
        self.camera.save()
        for primitive in filter(lambda e : e is not None, self.primitives):
            primitive.save()
        super(Scene, self).save(*args, **kwargs)


class Rendering(mongoengine.Document):
    width = mongoengine.IntField(required=True)
    height = mongoengine.IntField(required=True)
    samples = mongoengine.IntField(required=True)

    scene = mongoengine.ReferenceField(Scene)
    date_created = mongoengine.DateTimeField(default=datetime.now)

    def get_assignment(self):

        for assignment in Assignment.objects(rendering=self):
            if assignment.status != Assignment.UNASSIGNED:
                continue

            return assignment

        return None

    @staticmethod
    def create(scene, width, height, samples):
        assert width != 0
        assert height != 0
        assert samples != 0

        r = Rendering(width=width, height=height, samples=samples, scene=scene)

        count_width = int(math.ceil(float(width) / float(config.assigment_size)))
        count_height = int(math.ceil(float(height) / float(config.assigment_size)))
        count = count_width * count_height

        assert count != 0

        for i in range(0, count):
            x = config.assigment_size * (i % count_width)
            y = config.assigment_size * (i / count_width)

            assert x < width
            assert y < height

            a_width = min(config.assigment_size, width - x)
            a_height = min(config.assigment_size, height - y)

            assert a_width < width
            assert a_height < height

            a = Assignment(
                x=x,
                y=y,
                width=a_width,
                height=a_height,
                samples=samples,
                rendering=r,
                rendering_author=r.scene.created_by
            )
            a.save()

        return r


class Assignment(mongoengine.Document):
    UNASSIGNED, ASSIGNED, DONE = range(3)

    rendering_author = mongoengine.ReferenceField(User, required=True)

    x = mongoengine.IntField(required=True)
    y = mongoengine.IntField(required=True)
    width = mongoengine.IntField(required=True)
    height = mongoengine.IntField(required=True)
    samples = mongoengine.IntField(required=True)

    rendering = mongoengine.ReferenceField("Rendering", required=True)

    date = mongoengine.DateTimeField(default=datetime.now)
    status = mongoengine.IntField(default=UNASSIGNED)

    pixels = mongoengine.ListField()

    def save(self, *args, **kwargs):
        self.rendering.save()
        super(Assignment, self).save(*args, **kwargs)

    def composeGLSL(self):
        return library.main(self.rendering.scene, self)

def boiler_scene(user, title, description):
    s = Scene(created_by=user, title=title, description=description)
    s.camera.position[0] = -5
    s.camera.position[1] = -5
    s.camera.position[2] = 5

    s.camera.direction = utils.normalize(utils.sub([0.0, 0.0, 2.0], s.camera.position))

    s.add(primitives.Sphere(center=[0.0, 0.0, 10.0], radius=3.0, material=material.Emit(color=[12.0, 12.0, 12.0])))
    s.add(primitives.Sphere(center=[0.0, 3.0, 1.0], radius=1.0))#, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-2.5, 1.0, 1.0], radius=1.0))#, material=material.Glossy()))
    s.add(primitives.Cube(cubeMin=[2.0, -2.0, 1.0], cubeMax=[5.5, 2.0, 3.0], material=material.Mirror()))

    s.add(primitives.Plan(
        normal=[-1.0, 0.0, 0.0],
        distance=10.0,
        material=material.Diffuse(albedo=[0.75, 0.25, 0.25]))
    )  # X+
    s.add(primitives.Plan(
        normal=[1.0, 0.0, 0.0],
        distance=-10.0,
        material=material.Diffuse(albedo=[0.25, 0.25, 0.75]))
    )  # X-

    s.add(primitives.Plan(normal=[0.0, -1.0, 0.0], distance=10.0, material=material.Diffuse()))  # Y+
    s.add(primitives.Plan(normal=[0.0, 1.0, 0.0], distance=-10.0, material=material.Diffuse()))  # Y-

    s.add(primitives.Plan(normal=[0.0, 0.0, -1.0], distance=10.0, material=material.Diffuse())) # Z+
    s.add(primitives.Plan(normal=[0.0, 0.0, 1.0], distance=0.0, material=material.Diffuse()))   # Z-

    return s

if __name__ == "__main__":
    s = boiler_scene(user=None, title="dummy title", description="dummy description")

    glsl = s.composeGLSL()

    print glsl
