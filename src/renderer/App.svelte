<script>
  import './assets/app.css';
  import { ModeWatcher } from 'mode-watcher';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import DarkModeSwitcher from './components/DarkModeSwitcher.svelte';
  import RepoPicker from './components/RepoPicker.svelte';

  const Stages = {
    START: 0,
    NEW_PROJECT: 1
  };

  let appStage = Stages.START;

  function startNewProject() {
    appStage = Stages.NEW_PROJECT;
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions a11y-missing-attribute-->
<ModeWatcher></ModeWatcher>
<div class="flex h-screen flex-col">
  <div class="flex h-14 w-screen flex-grow-0 p-2">
    <DarkModeSwitcher></DarkModeSwitcher>
  </div>

  {#if appStage == Stages.START}
    <div class="flex flex-grow place-items-center justify-center">
      <Card.Root class="-mt-20 w-72">
        <Card.Header>
          <Card.Title>Welcome to Ponte!</Card.Title>
          <Card.Description>How do you want to proceed?</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="grid grid-cols-1 gap-2">
            <Button class="w-full" on:click={startNewProject}>Start new project</Button>
            <Button class="w-full">Load existing project</Button>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  {:else if appStage == Stages.NEW_PROJECT}
    <RepoPicker></RepoPicker>
  {/if}
</div>
