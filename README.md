# MSK of CDK for Terraform

## Command

| command                               | description                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| cdktf init                            | Create a new cdktf project from a template.                                      |
| cdktf get                             | Generate CDK Constructs for Terraform providers and modules.                     |
| cdktf convert                         | Converts a single file of HCL configuration to CDK for Terraform.                |
| cdktf deploy [stacks...]              | Deploy the given stacks [Alias: apply]                                           |
| cdktf destroy [stacks..]              | Destroy the given stacks                                                         |
| cdktf diff [stack]                    | Perform a diff (terraform plan) for the given stack [Alias: plan]                |
| cdktf list                            | List stacks in app.                                                              |
| cdktf login                           | Retrieves an API token to connect to Terraform Cloud or Terraform Enterprise.    |
| cdktf synth                           | Synthesizes Terraform code for the given app in a directory. [Alias: synthesize] |
| cdktf watch [stacks..] [experimental] | Watch for file changes and automatically trigger a deploy                        |
| cdktf output [stacks..]               | Prints the output of stacks [Alias: outputs]                                     |
| cdktf debug                           | Get debug information about the current project and environment                  |
| cdktf provider                        | A set of subcommands that facilitates provider management                        |
| cdktf completion                      | generate completion script                                                       |
