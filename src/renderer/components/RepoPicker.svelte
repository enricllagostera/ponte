<script>
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';

  let userRepoInfo = '';
  let validatePromise;

  function loadRepo() {
    console.log('load repo');
    // validatePromise = window.api.validateRepo(userRepoInfo);
  }

  function validateRepo() {
    if (userRepoInfo.length > 2) {
      console.log('validate repo');
      validatePromise = window.api.validateRepo(userRepoInfo);
    }
  }
</script>

<div class="flex w-screen grid-cols-2 gap-2 p-2">
  <Input placeholder="Find user/repo..." bind:value={userRepoInfo} on:input={validateRepo} class="w-48"></Input>
  {#await validatePromise}
    <Badge variant="outline">Validating...</Badge>
  {:then}
    <Button on:click={loadRepo}>Load repo</Button>
  {:catch}
    <Badge variant="destructive">Repo not found...</Badge>
  {/await}
</div>
