<?php

namespace app\common\library;

use Exception;
use Intervention\Image\ImageManager;

/**
 * 海报生成
 */
class Poster
{
	public $data = [];
	public $baseTpl = "";
	public $image = null;
	public $dirRoot = "";
	public $oss;
	public function __construct($data)
	{
		$this->data = $data;
		if(empty($data['uid']) || empty($data['tpl']) || empty($data['qrcode_url'])){
			return false;
		}
		$this->dirRoot = ROOT_PATH."public";
		$this->baseTpl = \fast\Utils::toMedia($data['tpl']);
		$this->manager = new ImageManager(array('driver' => 'gd'));
		$this->oss = Aliyun::getOss();
        $this->userInfo = \app\admin\model\User::where('id',$this->data['uid'])->find();
		$this->ossPath ='uploads/poster/' . md5($this->data['uid'].$this->data['tpl'].$this->data['qrcode_url'].$this->userInfo['nickname'].$this->userInfo['avatar']) . '_' . $this->data['uid'] . '.png';
		$this->logo = \think\config::get('site.imgapplogo');
	}
	/**
	 * 生成海报图
	 */
	public function run()
	{
		if (!$this->oss->isExists($this->ossPath)) {
			$dir = dirname($this->ossPath);
			if (!$this->oss->isExists($dir)) {
				$this->oss->mkDir($dir);
			}
			$poster = $this->getPoster();
			return $this->oss->uploadOs($this->ossPath, $poster->stream('jpg', 85)->getContents());
		}else {
			return $this->oss->getUrl($this->ossPath);
		}
	}
	/**
	 * 生成海报入口
	 * @return Image|string
	 * @throws Exception
	 */
	public function getPoster() {
		$poster = $this->generateTpl();
		$poster = $this->updateQrcode($poster);
		return $poster;
	}
	/**
	 * 生成海报
	 */
	private function generateTpl()
	{
		// 打开基础模板
		$goodsTpl = $this->manager->make($this->baseTpl)->resize(750, 1334);
        //邀请码
        $invite_code = '我的邀请码:';
        $invite_code = \fast\Utils::mb_chunk_split($invite_code, 24, "\r\n");
        $goodsTpl->text($invite_code, 80, 1018, function ($font) {
            /** @var  AbstractFont $font */
            $font->file(ROOT_PATH.'public/assets/fonts/YaHeiConsolasHybrid.ttf');
            $font->size(28);
            $font->color('#333333');
            $font->valign('top');
            $font->angle(0);
        });
        $goodsTpl->text($this->userInfo['invite_code'], 260, 1022, function ($font) {
            /** @var  AbstractFont $font */
            $font->file(ROOT_PATH.'public/assets/fonts/YaHeiConsolasHybrid.ttf');
            $font->size(32);
            $font->color('#333333');
            $font->valign('top');
            $font->angle(0);
        });
        //头像
        if(!empty($this->userInfo['avatar'])) {
            $avatar = \fast\Utils::wechatLogoFile($this->userInfo['avatar'],$this->data['uid']);
            $goodsThumb = $this->manager->make(ROOT_PATH."public".$avatar)->resize(100, 100);
            $goodsTpl->insert($goodsThumb, 'top-left', 70, 1120);
        }
        //昵称
        if(!empty($this->userInfo['nickname'])){
            $goodsTpl->text($this->userInfo['nickname'], 200, 1118, function ($font) {
                /** @var  AbstractFont $font */
                $font->file(ROOT_PATH.'public/assets/fonts/YaHeiConsolasHybrid.ttf');
                $font->size(28);
                $font->color('#333333');
                $font->valign('top');
                $font->angle(0);
            });
        }
        //简介
        $desc = [
            1=>'邀请你的伙伴一起来玩吧',
        ];
        $info = \fast\Utils::mb_chunk_split($desc[1], 10, "\r\n");
        $goodsTpl->text($info, 200, 1158, function ($font) {
            /** @var  AbstractFont $font */
            $font->file(ROOT_PATH.'public/assets/fonts/YaHeiConsolasHybrid.ttf');
            $font->size(24);
            $font->color('#666666');
            $font->valign('top');
            $font->angle(0);
        });
		return $goodsTpl;
	}
	/**
	 * 添加二维码
	 */
	private function updateQrcode($poster)
	{
		$qrImage = $this->getQrImage($this->data['qrcode_url']);
		$poster->insert($qrImage, 'top-left', 510, 1083);
		return $poster;
	}
	/**
	 * @param $qrcode_url
	 * @param int $size
	 * @return \Intervention\Image\Image
	 */
	public function getQrImage($qrcode_url) {
		$qrCode = new \Endroid\QrCode\QrCode($qrcode_url);
		$qrCode->setMargin(0);
		$qrCode->setSize(170);
		$qrCode->setErrorCorrectionLevel('medium');
		$qrImage = $this->manager->make($qrCode->writeString());
		return $qrImage;
	}
}
