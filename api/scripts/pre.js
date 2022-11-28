module.exports = async (runner, args) => {
  try {
    console.log("> PRE: Installing prerequisites (API):");

    const rc = args.rc;
    await runner.execute(
      [
        `nx g @nrwl/node:application ${rc.path}`,
        "npm install glob",
        "npm install ansi-colors",
        "npm install koa",
        "npm install koa-bodyparser",
        "npm install koa-router",
        "npm install @koa/cors",
        "npm install --save-dev @types/koa",
        "npm install --save-dev @types/koa-bodyparser",
        "npm install --save-dev @types/koa-router",
        "npm install --save-dev @types/koa__cors",
      ],
      {
        cwd: rc.workspace_path,
      }
    );

    console.log("> PRE: requisites ✅ DONE");
  } catch {
    console.error(ex);
    throw new Error("failed to install api pre-requisites");
  }
};
