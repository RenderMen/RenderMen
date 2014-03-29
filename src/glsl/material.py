
import utils


# ------------------------------------------------------------------------------ GLSL MATERIAL CODE

glsl_code = """

void
material_albedo(vec3 albedo)
{
    ray_color = vec3(0.1);
}

"""


# ------------------------------------------------------------------------------ ABSTRACT CLASS

class Abstract:

    def code(self):
        assert False


# ------------------------------------------------------------------------------ EMIT MATERIAL

class Emit:

    def __init__(self, color=[0.8, 0.8, 0.8]):
        self.color = color

    def code(self):
        code_tmplt = "ray_color = {color};"

        return code_tmplt.format(
            color=utils.code_vec(self.color)
        )

# ------------------------------------------------------------------------------ DIFFUSE MATERIAL

class Diffuse:

    def __init__(self, albedo=[0.8, 0.8, 0.8]):
        self.albedo = albedo

    def code(self):
        code_tmplt = "material_albedo({albedo});"

        return code_tmplt.format(
            albedo=utils.code_vec(self.albedo)
        )
