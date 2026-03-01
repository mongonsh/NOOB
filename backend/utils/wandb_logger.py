from utils.config import WANDB_API_KEY


def _wandb():
    """Lazy import — protobuf version conflict won't crash the app."""
    import wandb  # noqa: PLC0415
    return wandb


def log_game_generation(game_id: str, manual_title: str, page_count: int, mission_count: int):
    try:
        wb = _wandb()
        wb.init(project="noob-safety-training", name=f"game-{game_id}", reinit=True)
        wb.log({
            "event": "game_generated",
            "game_id": game_id,
            "manual_title": manual_title,
            "page_count": page_count,
            "mission_count": mission_count,
        })
        wb.finish()
    except Exception as e:
        print(f"[wandb] log_game_generation skipped: {e}")


def log_completion(game_id: str, player_data: dict):
    try:
        wb = _wandb()
        wb.init(project="noob-safety-training", name=f"completion-{game_id}", reinit=True)
        wb.log({
            "event": "training_completed",
            "game_id": game_id,
            "score": player_data.get("score", 0),
            "missions_completed": player_data.get("missions_completed", 0),
            "total_missions": player_data.get("total_missions", 0),
            "correct_answers": player_data.get("correct_answers", 0),
            "time_seconds": player_data.get("time_seconds", 0),
        })
        wb.finish()
    except Exception as e:
        print(f"[wandb] log_completion skipped: {e}")
