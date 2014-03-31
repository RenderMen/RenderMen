#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
sys.path.append('..')

import os
import math
import camera
import primitives
import material
import library
import utils
import datetime
import config

import png
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
    max_iterations = mongoengine.IntField(required=True)

    scene = mongoengine.ReferenceField(Scene)
    date_created = mongoengine.DateTimeField(default=datetime.now)

    def get_assignment(self):
        for assignment in Assignment.objects(rendering=self):
            if assignment.status != Assignment.UNASSIGNED:
                continue
            return assignment

        return None

    def png(self):
        path = config.renders_directory + self.id + ".png"

        if os.path.isfile(path):
            return path

        os.makedirs(config.renders_directory)

        array = list()

        for i in range(0, self.width):
            array.append(list())

        for assignment in Assignment.objects(rendering=self):
            for y in range(assignment.y, assignment.y + assignment.height):
                for x in range(assignment.x, assignment.x + assignment.width):
                    for s in range(0, len(assignment.pixels)):
                        array[x][y] = [
                            assignment.pixels[4 * s + 0],
                            assignment.pixels[4 * s + 1],
                            assignment.pixels[4 * s + 2],
                            assignment.pixels[4 * s + 3]
                        ]

        png.from_array(array, 'RGBA').save(path)

        return path

    def progress(self):
        assignments = Assignment.objects(rendering=self)
        return len([a for a in assignments if a.status == Assignment.DONE]) / float(len(assignments))

    @staticmethod
    def create(scene, width, height, samples, max_iterations):
        assert width != 0
        assert height != 0
        assert samples != 0

        r = Rendering(width=width, height=height, samples=samples, max_iterations=max_iterations, scene=scene)

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
                max_iterations=max_iterations,
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
    max_iterations = mongoengine.IntField(required=True)

    rendering = mongoengine.ReferenceField(Rendering, required=True)

    date = mongoengine.DateTimeField(default=datetime.now)
    status = mongoengine.IntField(default=UNASSIGNED)
    assigned_to = mongoengine.ReferenceField(User, default=None)

    pixels = mongoengine.ListField(mongoengine.IntField())

    def save(self, *args, **kwargs):
        self.rendering.save()
        super(Assignment, self).save(*args, **kwargs)

    def composeGLSL(self):
        return library.main(self.rendering.scene, self)

def boiler_scene(user, title, description):
    s = Scene(created_by=user, title=title, description=description)
    s.camera.look_from = [-7, -7, 7]
    s.camera.look_at = [0.0, 3.0, 2.0]
    #s.camera.field_of_view = math.pi * 0.1
    s.camera.blur_factor = 0.3

    s.add(primitives.Sphere(center=[0.0, 0.0, 10.0], radius=3.0, material=material.Emit(color=[12.0, 12.0, 12.0])))
    s.add(primitives.Sphere(center=[0.0, 3.0, 1.0], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-4.0, 3.0, 1.0], radius=1.0, material=material.Glossy()))
    s.add(primitives.Sphere(center=[-1.0, -1.0, 1.0], radius=1.0))#, material=material.Mirror()))
    #s.add(primitives.Sphere(center=[-2.5, 2.0, 2.5], radius=1.5, albedo=[1.0, 1.0, 1.0], material=material.Transparent(refract_factor=0.94)))
    s.add(primitives.Cube(cubeMin=[2.0, -2.0, 1.0], cubeMax=[5.5, 2.0, 3.0], material=material.Mirror()))
    #s.add(primitives.Triangle(A=[0.0, 0.0, 1.0], B=[1.0, 0.0, 1.0], C=[0.0, 1.0, 1.0]
            #, material=material.Mirror()))
            #))

    s.add(primitives.Triangle(A=[-6.0, 5.0, 0.0], B=[-2.0, 5.0, 0.0], C=[-6.0, 5.0, 5.0]
        , material = material.Mirror()))

    s.add(primitives.Plan(
        normal=[-1.0, 0.0, 0.0],
        distance=10.0,
        material=material.Diffuse(albedo=[0.75, 0.25, 0.25]))
    )  # X+
    s.add(primitives.Plan(
        normal=[1.0, 0.0, 0.0],
        distance=10.0,
        material=material.Diffuse(albedo=[0.25, 0.25, 0.75]))
    )  # X-

    s.add(primitives.Plan(normal=[0.0, -1.0, 0.0], distance=10.0, material=material.Diffuse()))  # Y+
    s.add(primitives.Plan(normal=[0.0, 1.0, 0.0], distance=10.0, material=material.Diffuse()))  # Y-

    s.add(primitives.Plan(normal=[0.0, 0.0, -1.0], distance=10.0, material=material.Diffuse())) # Z+
    s.add(primitives.Plan(normal=[0.0, 0.0, 1.0], distance=0.0, material=material.Diffuse()))#Glossy(hardness=1.4)))   # Z-

    return s

def pyramide_scene(user, title, description):
    s = Scene(created_by=user, title=title, description=description)
    s.camera.look_from = [-8, 7, 7]
    s.camera.look_at = [0.0, 0.0, 0.0]
    #s.camera.field_of_view = math.pi * 0.1
    s.camera.blur_factor = 0

    s.add(primitives.Sphere(center=[0.0, 0.0, 10.0], radius=3.0, material=material.Emit(color=[12.0, 12.0, 12.0])))

    sqrt2 = math.sqrt(2)

    s.add(primitives.Sphere(center=[0.0, 1.0, 1.0], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[0.0, 3.0, 1.0], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[0.0, 5.0, 1.0], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-2 * sqrt2 + 1, 2.0, 1.0], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-2 * sqrt2 + 1, 4.0, 1.0], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-4 * sqrt2 + 2, 3.0, 1.0], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-1.0, 2.0, 1.0 + sqrt2], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-1.0, 4.0, 1.0 + sqrt2], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-4 * sqrt2 + 3, 3.0, 1.0 + sqrt2], radius=1.0, material=material.Mirror()))
    s.add(primitives.Sphere(center=[-sqrt2, 3.0, 1.0 + 2 * sqrt2], radius=1.0, material=material.Mirror()))

    s.add(primitives.Cube(cubeMin=[-6.0, -4.0, 1.0], cubeMax=[4.0, -3.5, 4.0], material=material.Mirror()))

    #s.add(primitives.Triangle(A=[0.0, 0.0, 1.0], B=[1.0, 0.0, 1.0], C=[0.0, 1.0, 1.0]
            #, material=material.Mirror()))
            #))

    #s.add(primitives.Triangle(A=[-6.0, 5.0, 0.0], B=[-2.0, 5.0, 0.0], C=[-6.0, 5.0, 5.0]
        #, material = material.Mirror()))

    s.add(primitives.Plan(
        normal=[-1.0, 0.0, 0.0],
        distance=10.0,
        material=material.Diffuse(albedo=[0.75, 0.25, 0.25]))
    )  # X+
    s.add(primitives.Plan(
        normal=[1.0, 0.0, 0.0],
        distance=10.0,
        material=material.Diffuse(albedo=[0.25, 0.25, 0.75]))
    )  # X-

    s.add(primitives.Plan(normal=[0.0, -1.0, 0.0], distance=10.0, material=material.Diffuse()))  # Y+
    s.add(primitives.Plan(normal=[0.0, 1.0, 0.0], distance=10.0, material=material.Diffuse()))  # Y-

    s.add(primitives.Plan(normal=[0.0, 0.0, -1.0], distance=10.0, material=material.Diffuse())) # Z+
    s.add(primitives.Plan(normal=[0.0, 0.0, 1.0], distance=0.0, material=material.Diffuse()))#material.Glossy(hardness=1.4)))   # Z-

    return s



if __name__ == "__main__":
    s = boiler_scene(user=None, title="dummy title", description="dummy description")

    glsl = s.composeGLSL()

    print glsl
