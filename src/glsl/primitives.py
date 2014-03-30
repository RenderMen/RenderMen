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

    if(max(tMin, tzMax) > 0.0)
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
                attr_normal = vec3(0.0, 0.0, -1.0);
            }

            attr_pos = ray_origin + ray_intersection_dist * ray_dir;

            return 1;
        }
        else
        {
            ray_intersection_dist = tMin;

            if(tyMin > txMin)
            {
                if(ray_dir.y > 0.0)
                {
                    attr_normal = vec3(-1.0, 0.0, 0.0);
                }
                else
                {
                    attr_normal = vec3(-1.0, 0.0, 0.0);
                }
            }
            else
            {
                if(ray_dir.x > 0.0)
                {
                    attr_normal = vec3(0.0, -1.0, 0.0);
                }
                else
                {
                    attr_normal = vec3(0.0, -1.0, 0.0);
                }
            }

            attr_pos = ray_origin + ray_intersection_dist * ray_dir;

            return 1;
        }

        return 0;
    }
}

int
intersect_triangle(vec3 p0, vec3 p1, vec3 p2)
{
    vec3 p0p1 = p1 - p0;
    vec3 p0p2 = p2 - p0;
    vec3 normal = cross(p0p1, p0p2);

    float nDotRay = dot(normal, ray_dir);

    // The ray is parallel
    if(abs(nDotRay) < 0.0001) //FIXME
    {
        return 0;
    }

    float d = dot(normal, p0);
    float t = -(dot(normal, ray_origin) + d) / nDotRay;

    //if(t < 0.0)
    //{
    //    return 0;
    //}

    // Inside-out test
    vec3 phit = ray_origin + t * ray_dir;

    // Inside-out test edge0
    vec3 edge0 = phit - p0;
    float v = dot(normal, cross(p0p1, edge0));
    if(v < 0.0) // Outside triangle
    {
        return 0;
    }

    // Inside-out test edge1
    vec3 edge1 = phit - p1;
    vec3 p1p2 = p2 - p1;
    float w = dot(normal, cross(p1p2, edge1));
    if(w < 0.0) // Outside triangle
    {
        return 0;
    }

    // Inside-out test edge2
    vec3 edge2 = phit - p2;
    vec3 p2p0 = p0 - p2;
    float u = dot(normal, cross(p2p0, edge2));
    if(u < 0.0) // Outside triangle
    {
        return 0;
    }

    ray_intersection_dist = t;
    attr_pos = phit;
    attr_normal = normalize(normal);

    ray_color = attr_normal;

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
        p0 = vec3
        p1 = vec3
        p2 = vec3
    """

    p0 = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [-0.5, 2.0, 2.5])
    p1 = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.5, 2.0, 1.5])
    p2 = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.5, 2.0, 4.5])

    def intersect_call(self):
        code_tmplt = "intersect_triangle({p0}, {p1}, {p2})"

        return code_tmplt.format(
            p0=utils.code_vec(self.p0),
            p1=utils.code_vec(self.p1),
            p2=utils.code_vec(self.p2),
        )

