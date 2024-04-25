{
  description = "A simple development environment for AWS CDK with TypeScript";

  inputs = {
    nixpkgs = {
      url = "github:NixOS/nixpkgs/nixos-unstable";
    };
  };

  outputs = { self, nixpkgs }: {
    devShell.x86_64-linux = with nixpkgs.legacyPackages.x86_64-linux;
    mkShell {
      buildInputs = [
        nodejs
        nodePackages.aws-cdk
        awscli2
      ];
      shellHook = ''
        export NODE_PATH="${nodejs}/lib/node_modules:${nodePackages.aws-cdk}/lib/node_modules:$NODE_PATH"
      '';
    };

  };
}

