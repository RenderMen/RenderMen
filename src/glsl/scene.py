
import math
import camera
import primitives
import material
import library
import utils


class Scene:
    """scene content

        camera = Camera()
        primitives = [primitives.Sphere]
    """

    def __init__(self):
        self.camera = camera.Camera()
        self.primitives = []

    def add(self, primitive):
        self.primitives.append(primitive)

    def composeGLSL(self):
        return library.main(self)

def boiler_scene():
    s = Scene()
    s.camera.position[0] = -3
    s.camera.position[1] = -3
    s.camera.position[2] = 3

    s.camera.direction = utils.normalize(utils.sub([0.0, 0.0, 0.0], s.camera.position))

    #s.add(primitives.Sphere(material=material.Emit(color=[0.5, 0.5, 1.0])))
    s.add(primitives.Sphere(center=[0.0, 0.0, 1.0], radius=1.0, material=material.Emit(color=[3.0, 3.0, 3.0])))

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
    s = boiler_scene()

    glsl = s.composeGLSL()

    print glsl
