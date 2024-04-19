import aws_cdk as core
import aws_cdk.assertions as assertions

from security_base_python.security_base_python_stack import SecurityBasePythonStack

# example tests. To run these tests, uncomment this file along with the example
# resource in security_base_python/security_base_python_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = SecurityBasePythonStack(app, "security-base-python")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
