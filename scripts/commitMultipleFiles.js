export default async function commitMultipleFiles(
  octokit,
  owner,
  repo,
  branch,
  message,
  changes,
) {
  // Get the latest commit SHA on the specified branch
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const latestCommitSha = refData.object.sha;

  // Get the tree SHA for the latest commit
  const { data: commitData } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });
  const treeSha = commitData.tree.sha;

  // Create blobs for each file
  const blobs = await Promise.all(
    changes.map(async (change) => {
      const { data: blobData } = await octokit.git.createBlob({
        owner,
        repo,
        content: change.content,
        encoding: 'utf-8',
      });
      return {
        sha: blobData.sha,
        path: change.path,
        mode: '100644',
        type: 'blob',
      };
    }),
  );

  // Create a new tree with the new blobs
  const { data: treeData } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: treeSha,
    tree: blobs,
  });

  // Create a new commit with the new tree
  const { data: newCommitData } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: treeData.sha,
    parents: [latestCommitSha],
  });

  // Update the branch reference to point to the new commit
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommitData.sha,
  });
}
