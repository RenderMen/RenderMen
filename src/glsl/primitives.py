import mongoengine

import utils
import material

# ------------------------------------------------------------------------------ GLSL SPHERE

glsl_code = """

int
intersect_sphere(vec4 sphere)
{
    vec3 oc = sphere.xyz - ray_origin;

    float b = dot(oc, ray_dir);
    float det = b * b - dot(oc, oc) + sphere.w * sphere.w;

    if (det <= 0.0)
    {
        return 0;
    }

    float distance = b - sqrt(det);

    if ((distance > MATH_EPSILON) && (distance < ray_intersection_dist))
    {
        ray_intersection_dist = distance;
        attr_pos = ray_origin + distance * ray_dir;
        attr_normal = normalize(attr_pos - sphere.xyz);

        return 1;
    }

    return 0;
}

int
intersect_plan(vec4 plan)
{
    float dot_normal = dot(ray_dir, plan.xyz);

    if (dot_normal > 0.0)
    {
        return 0;
    }

    float plan_distance = dot(ray_origin, plan.xyz) + plan.w;
    float distance = - plan_distance / dot_normal;

    if ((distance > MATH_EPSILON) && (distance < ray_intersection_dist))
    {
        ray_intersection_dist = distance;
        attr_pos = ray_origin + distance * ray_dir;
        attr_normal = plan.xyz;

        return 1;
    }

    return 0;
}

int
intersect_cube(vec3 cubeMin, vec3 cubeMax)
{
    vec3 inv_dir = 1.0 / ray_dir;

    float txA = (cubeMin.x - ray_origin.x) * inv_dir.x;
    float txB = (cubeMax.x - ray_origin.x) * inv_dir.x;

    float tyA = (cubeMin.y - ray_origin.y) * inv_dir.y;
    float tyB = (cubeMax.y - ray_origin.y) * inv_dir.y;

    float txMin = min(txA, txB);
    float txMax = max(txA, txB);

    float tyMin = min(tyA, tyB);
    float tyMax = max(tyA, tyB);

    if((txMin > tyMax) || (tyMin > txMax))
    {
        return 0;
    }

    float tMin = max(txMin, tyMin);
    float tMax = min(txMax, tyMax);

    float tzA = (cubeMin.z - ray_origin.z) * inv_dir.z;
    float tzB = (cubeMax.z - ray_origin.z) * inv_dir.z;

    float tzMin = min(tzA, tzB);
    float tzMax = max(tzA, tzB);

    if((tMin > tzMax) || (tzMin > tMax))
    {
        return 0;
    }

    if(max(tMin, tzMin) > 0.0)
    {
        if(tzMin > tMin)
        {
            ray_intersection_dist = tzMin;

            if(ray_dir.z > 0.0)
            {
                attr_normal = vec3(0.0, 0.0, -1.0);
            }
            else
            {
                attr_normal = vec3(0.0, 0.0, 1.0);
            }
        }
        else
        {
            ray_intersection_dist = tMin;

            if(tyMin > txMin)
            {
                if(ray_dir.y > 0.0)
                {
                    attr_normal = vec3(0.0, -1.0, 0.0);
                }
                else
                {
                    attr_normal = vec3(0.0, 1.0, 0.0);
                }
            }
            else
            {
                if(ray_dir.x > 0.0)
                {
                    attr_normal = vec3(-1.0, 0.0, 0.0);
                }
                else
                {
                    attr_normal = vec3(1.0, 0.0, 0.0);
                }
            }
        }

        attr_pos = ray_origin + ray_intersection_dist * ray_dir;

        return 1;
    }

    return 0;
}

int
intersect_triangle(vec3 A, vec3 B, vec3 C)
{
    vec3 AB = B - A;
    vec3 AC = C - A;
    vec3 normal = cross(AB, AC);

    float distance_from_plan = dot(ray_origin - A, normal);

    float normal_dot_ray = dot(normal, ray_dir);

    float distance = -distance_from_plan / normal_dot_ray;

    if(distance < MATH_EPSILON || distance > ray_intersection_dist)
    {
        return 0;
    }

    vec3 intersection = ray_origin + distance * ray_dir - A;

    float basis_dot = dot(AB, AC);
    float inv_squared_length_AB = 1.0 / dot(AB, AB);
    float inv_squared_length_AC = 1.0 / dot(AC, AC);

    float uh2 = basis_dot * inv_squared_length_AB;
    float vh1 = basis_dot * inv_squared_length_AC;

    float inv_det = 1.0 / (1.0 - uh2 * vh1);

    float h1 = dot(intersection, AB) * inv_squared_length_AB;
    float h2 = dot(intersection, AC) * inv_squared_length_AC;

    float u = (h1 - h2 * uh2) * inv_det;

    if(u < 0.0)
    {
        return 0;
    }

    float v = (h2 - vh1 * h1) * inv_det;

    if((v < 0.0) || ((u + v) > 1.0))
    {
        return 0;
    }

    ray_intersection_dist = distance;
    attr_pos = ray_origin + ray_intersection_dist * ray_dir;
    attr_normal = normalize(normal);

    return 1;
}

"""


# ------------------------------------------------------------------------------ ABSTRACT CLASS

class Abstract(mongoengine.Document):
    material = mongoengine.ReferenceField(material.Abstract, default=None)

    meta = {'allow_inheritance': True}

    def save(self, *args, **kwargs):
        if self.material:
            self.material.save()
        super(Abstract, self).save(*args, **kwargs)

    def material_code(self):
        if self.material == None:
            return """
    ray_color = 0.5 * attr_normal + 0.5;
    ray_stop();
    """

        return self.material.code()


    def intersect_call(self):
        assert False



# ------------------------------------------------------------------------------ SPHERE

class Sphere(Abstract):
    """
        center = vec3
        radius = float
    """

    center = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.0, 0.0, 0.0])
    radius = mongoengine.FloatField(default=1.0)

    @property
    def vec4(self):
        return [self.center[0], self.center[1], self.center[2], self.radius]

    def intersect_call(self):
        code_tmplt = "intersect_sphere({sphere})"

        return code_tmplt.format(
            sphere=utils.code_vec(self.vec4)
        )


# ------------------------------------------------------------------------------ PLAN

class Plan(Abstract):
    """
        normal = vec3
        distance = float
    """

    normal = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.0, 0.0, 1.0])
    distance = mongoengine.FloatField(default=0.0)

    @property
    def vec4(self):
        return [self.normal[0], self.normal[1], self.normal[2], self.distance]

    def intersect_call(self):
        code_tmplt = "intersect_plan({plan})"

        return code_tmplt.format(
            plan=utils.code_vec(self.vec4)
        )


# ------------------------------------------------------------------------------ CUBE

class Cube(Abstract):
    """
        cubeMin = vec3
        cubeMax = vec3
        normalMatrix = mat3x3
    """

    cubeMin = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.5, -0.5, 1.5])
    cubeMax = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [1.5, -1.5, 2.5])

    def intersect_call(self):
        code_tmplt = "intersect_cube({cubeMin}, {cubeMax})"

        return code_tmplt.format(
            cubeMin=utils.code_vec(self.cubeMin),
            cubeMax=utils.code_vec(self.cubeMax),
        )

# ------------------------------------------------------------------------------ TRIANGLE

class Triangle(Abstract):
    """
        A = vec3
        B = vec3
        C = vec3
    """

    A = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [-0.5, 2.0, 2.5])
    B = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.5, 2.0, 1.5])
    C = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.5, 2.0, 4.5])

    def intersect_call(self):
        code_tmplt = "intersect_triangle({A}, {B}, {C})"

        return code_tmplt.format(
            A=utils.code_vec(self.A),
            B=utils.code_vec(self.B),
            C=utils.code_vec(self.C),
        )

